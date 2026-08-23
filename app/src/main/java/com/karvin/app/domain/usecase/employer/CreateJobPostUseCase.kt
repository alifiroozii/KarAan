package com.karvin.app.domain.usecase.employer

import com.karvin.app.domain.model.Job
import com.karvin.app.domain.repository.EmployerRepository
import com.karvin.app.utils.Resource
import javax.inject.Inject

class CreateJobPostUseCase @Inject constructor(
    private val employerRepository: EmployerRepository
) {
    suspend operator fun invoke(job: Job): Resource<Job> {
        if (job.title.isBlank()) {
            return Resource.Error("عنوان شغل الزامی است")
        }
        if (job.description.isBlank()) {
            return Resource.Error("توضیحات شغل الزامی است")
        }
        if (job.salaryToman <= 0) {
            return Resource.Error("مبلغ دستمزد باید بیشتر از صفر باشد")
        }
        if (job.numberOfWorkersNeeded <= 0) {
            return Resource.Error("تعداد نیروی مورد نیاز باید حداقل ۱ نفر باشد")
        }
        if (job.date.isBlank()) {
            return Resource.Error("تاریخ انجام کار الزامی است")
        }
        return employerRepository.createJobPost(job)
    }
}
